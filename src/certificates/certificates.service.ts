import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CertificateRepository } from './certificate.repository';
import { EnrollmentRepository } from '../enrollments/enrollment.repository';
import { UserService } from 'src/user/user.service';
import { CoursesService } from 'src/courses/courses.service';
import { GenerateCertificateDto } from './dto/create-certificate.dto';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Response } from 'express';

@Injectable()
export class CertificatesService {
  constructor(
    private certificateRepository: CertificateRepository,
    private enrollmentRepository: EnrollmentRepository,
    private userService: UserService,
    private courseService: CoursesService,
  ) {}

  async generateCertificate(
    generateDto: GenerateCertificateDto,
    userId: string,
  ) {
    let enrollment;

    if (generateDto.enrollmentId) {
      // Get enrollment by ID
      enrollment = await this.enrollmentRepository.findOne(
        generateDto.enrollmentId,
      );
    } else if (generateDto.courseId) {
      // Get enrollment by student and course
      enrollment = await this.enrollmentRepository.findOneByStudentAndCourse(
        userId,
        generateDto.courseId,
      );
    } else {
      throw new BadRequestException(
        'Either enrollmentId or courseId is required',
      );
    }

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Check if user owns this enrollment
    if (enrollment.studentId !== userId) {
      throw new ForbiddenException(
        'You can only generate certificates for your own enrollments',
      );
    }

    // Check if course is completed
    if (enrollment.status !== 'COMPLETED') {
      throw new ConflictException(
        'Course must be completed to generate certificate',
      );
    }

    // Check if certificate already exists
    const existingCertificate =
      await this.certificateRepository.findByEnrollment(enrollment.id);
    if (existingCertificate) {
      return existingCertificate;
    }

    // Generate unique certificate number
    const certificateNo =
      await this.certificateRepository.generateCertificateNumber();

    // Create certificate
    const certificate = await this.certificateRepository.create({
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      certificateNo,
      metadata: {
        generatedBy: 'system',
        courseCompletionDate: enrollment.completedAt,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        courseName: enrollment.course.title,
      },
    });

    return certificate;
  }

  async findAll(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return this.certificateRepository.findAll();
    } else if (userRole === 'INSTRUCTOR') {
      // Instructors can see certificates for their courses
      const courses = await this.courseService.findByInstructor(userId);
      const courseIds = courses.map((c) => c.id);

      const certificates = await Promise.all(
        courseIds.map((id) => this.certificateRepository.findByCourse(id)),
      );

      return certificates.flat();
    } else {
      // Students can only see their own certificates
      return this.certificateRepository.findByStudent(userId);
    }
  }

  async findOne(id: string, userId: string, userRole: string) {
    const certificate = await this.certificateRepository.findOne(id);

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    // Check permissions
    if (
      userRole !== 'ADMIN' &&
      certificate.studentId !== userId &&
      certificate.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to this certificate',
      );
    }

    return certificate;
  }

  async findByStudent(
    studentId: string,
    requestingUserId: string,
    userRole: string,
  ) {
    if (userRole !== 'ADMIN' && studentId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own certificates');
    }

    return this.certificateRepository.findByStudent(studentId);
  }

  async verifyCertificate(certificateNo: string) {
    const certificate =
      await this.certificateRepository.findByCertificateNo(certificateNo);

    if (!certificate) {
      throw new NotFoundException('Invalid certificate number');
    }

    if (!certificate.isValid) {
      return {
        isValid: false,
        message: 'This certificate has been invalidated',
        certificate: null,
      };
    }

    return {
      isValid: true,
      message: 'Certificate is valid',
      certificate: {
        id: certificate.id,
        certificateNo: certificate.certificateNo,
        studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
        courseName: certificate.course.title,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
      },
    };
  }

  async downloadCertificate(
    id: string,
    userId: string,
    userRole: string,
    res: Response,
  ) {
    const certificate = await this.certificateRepository.findOne(id);

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    // Check permissions
    if (
      userRole !== 'ADMIN' &&
      certificate.studentId !== userId &&
      certificate.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to this certificate',
      );
    }

    // Update download count
    await this.certificateRepository.updateDownloadCount(id);

    // Generate PDF
    const pdfBuffer = await this.generateCertificatePDF(certificate);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificate-${certificate.certificateNo}.pdf`,
    );

    // Send PDF
    res.send(pdfBuffer);
  }

  async invalidateCertificate(id: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can invalidate certificates');
    }

    const certificate = await this.certificateRepository.findOne(id);

    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }

    return this.certificateRepository.invalidate(id);
  }

  async getCertificateStats(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      const total = await this.certificateRepository.count();
      const recent = await this.certificateRepository.getRecentCertificates(10);

      return {
        total,
        recent,
      };
    } else if (userRole === 'INSTRUCTOR') {
      const courses = await this.courseService.findByInstructor(userId);
      let total = 0;

      for (const course of courses) {
        total += await this.certificateRepository.countByStudent(course.id);
      }

      return { total };
    } else {
      const total = await this.certificateRepository.countByStudent(userId);
      const certificates =
        await this.certificateRepository.findByStudent(userId);

      return {
        total,
        certificates: certificates.slice(0, 5),
      };
    }
  }

  private async generateCertificatePDF(certificate: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

        // Add title
        doc
          .fontSize(30)
          .font('Helvetica-Bold')
          .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });

        // Add "This is to certify that"
        doc
          .fontSize(16)
          .font('Helvetica')
          .text('This is to certify that', 0, 150, { align: 'center' });

        // Add student name
        doc
          .fontSize(40)
          .font('Helvetica-Bold')
          .text(
            `${certificate.student.firstName} ${certificate.student.lastName}`,
            0,
            200,
            { align: 'center' },
          );

        // Add course completion text
        doc
          .fontSize(16)
          .font('Helvetica')
          .text('has successfully completed the course', 0, 280, {
            align: 'center',
          });

        // Add course name
        doc
          .fontSize(30)
          .font('Helvetica-Bold')
          .text(certificate.course.title, 0, 320, { align: 'center' });

        // Add date
        doc
          .fontSize(14)
          .font('Helvetica')
          .text(
            `Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`,
            50,
            450,
          );

        // Add certificate number
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Certificate No: ${certificate.certificateNo}`, 50, 480);

        // Generate QR Code
        const verificationUrl = `${process.env.APP_URL}/certificates/verify/${certificate.certificateNo}`;
        const qrBuffer = await QRCode.toBuffer(verificationUrl);

        doc.image(qrBuffer, doc.page.width - 150, 400, {
          fit: [100, 100],
          align: 'center',
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
