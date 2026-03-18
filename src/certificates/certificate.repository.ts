import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Certificate } from '@prisma/client';

@Injectable()
export class CertificateRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    studentId: string;
    courseId: string;
    enrollmentId: string;
    certificateNo: string;
    metadata?: any;
    expiryDate?: Date;
  }) {
    return this.prisma.certificate.create({
      data: {
        ...data,
        issueDate: new Date(),
        isValid: true,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            category: true,
          },
        },
        enrollment: true,
      },
    });
  }

  async findAll() {
    return this.prisma.certificate.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.certificate.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            category: true,
          },
        },
        enrollment: true,
      },
    });
  }

  async findByCertificateNo(certificateNo: string) {
    return this.prisma.certificate.findUnique({
      where: { certificateNo },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            category: true,
          },
        },
      },
    });
  }

  async findByEnrollment(enrollmentId: string) {
    return this.prisma.certificate.findUnique({
      where: { enrollmentId },
    });
  }

  async updateDownloadCount(id: string) {
    return this.prisma.certificate.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }

  async invalidate(id: string) {
    return this.prisma.certificate.update({
      where: { id },
      data: { isValid: false },
    });
  }

  async remove(id: string) {
    return this.prisma.certificate.delete({
      where: { id },
    });
  }

  async generateCertificateNumber(): Promise<string> {
    const prefix = 'CERT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async count() {
    return this.prisma.certificate.count();
  }

  async countByStudent(studentId: string) {
    return this.prisma.certificate.count({
      where: { studentId },
    });
  }

  async getRecentCertificates(limit: number = 10) {
    return this.prisma.certificate.findMany({
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }
}
