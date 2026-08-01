import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: { userId, rating: dto.rating, comment: dto.comment },
    });
  }
}
