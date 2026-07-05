import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ID_GENERATOR_PORT, IdGeneratorPort } from '@shared/application/ports/id-generator.port';
import { Inject } from '@nestjs/common';
import { TicketNotFoundError } from '@tickets/domain/errors/ticket-not-found.error';

@Injectable()
export class AddTicketNoteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ID_GENERATOR_PORT) private readonly idGen: IdGeneratorPort,
  ) {}

  async execute(ticketId: string, authorId: string, content: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new TicketNotFoundError(ticketId);

    const note = await this.prisma.ticketNote.create({
      data: {
        id: this.idGen.generate(),
        ticketId,
        authorId,
        content,
        isInternal: true,
      },
    });

    return {
      id: note.id,
      ticketId: note.ticketId,
      content: note.content,
      createdAt: note.createdAt,
    };
  }
}
