import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { GenerateCertificateDto } from './dto/create-certificate.dto';
import {
  CertificateResponseDto,
  CertificateListResponseDto,
} from './dto/certificate-response.dto';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Response } from 'express';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificateService: CertificatesService) {}

  @Post('generate')
  @Roles('STUDENT')
  @Serialize(CertificateResponseDto)
  async generateCertificate(
    @Body() generateDto: GenerateCertificateDto,
    @Req() req,
  ) {
    return this.certificateService.generateCertificate(
      generateDto,
      req.user.id,
    );
  }

  @Get('eligibility/:courseId')
  @Roles('STUDENT')
  async checkEligibility(@Param('courseId') courseId: string, @Req() req) {
    return this.certificateService.checkEligibilityForCertificate(
      courseId,
      req.user.id,
    );
  }

  @Get()
  @Serialize(CertificateListResponseDto)
  async findAll(@Req() req) {
    return this.certificateService.findAll(req.user.id, req.user.role);
  }

  @Get('my-certificates')
  @Roles('STUDENT')
  @Serialize(CertificateListResponseDto)
  async getMyCertificates(@Req() req) {
    return this.certificateService.findByStudent(
      req.user.id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('student/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @Serialize(CertificateListResponseDto)
  async findByStudent(@Param('studentId') studentId: string, @Req() req) {
    return this.certificateService.findByStudent(
      studentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('stats')
  async getStats(@Req() req) {
    return this.certificateService.getCertificateStats(
      req.user.id,
      req.user.role,
    );
  }

  @Get('verify/:certificateNo')
  @HttpCode(HttpStatus.OK)
  async verifyCertificate(@Param('certificateNo') certificateNo: string) {
    return this.certificateService.verifyCertificate(certificateNo);
  }

  @Get(':id')
  @Serialize(CertificateResponseDto)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.certificateService.findOne(id, req.user.id, req.user.role);
  }

  @Get(':id/download')
  async downloadCertificate(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    return this.certificateService.downloadCertificate(
      id,
      req.user.id,
      req.user.role,
      res,
    );
  }

  @Patch(':id/invalidate')
  @Roles('ADMIN')
  async invalidateCertificate(@Param('id') id: string, @Req() req) {
    return this.certificateService.invalidateCertificate(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @Req() req) {
    return this.certificateService.invalidateCertificate(
      id,
      req.user.id,
      req.user.role,
    );
  }
}
