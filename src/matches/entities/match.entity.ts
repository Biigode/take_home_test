import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { KillEntity } from './kill.entity';
import { MatchPlayerEntity } from './match-player.entity';

@Entity('matches')
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  externalId: string;

  @OneToMany(() => MatchPlayerEntity, (mp) => mp.match, { cascade: true })
  players: MatchPlayerEntity[];

  @OneToMany(() => KillEntity, (kill) => kill.match, { cascade: true })
  kills: KillEntity[];

  @Column()
  createdAt: Date;
}
