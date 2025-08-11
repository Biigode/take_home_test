import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MatchEntity } from './match.entity';
import { PlayerEntity } from './player.entity';

@Entity('kills')
export class KillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MatchEntity, (match) => match.kills)
  @JoinColumn({ name: 'match_id' })
  match: MatchEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.kills, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'killer_id' })
  killer: PlayerEntity | null; // null para <WORLD>

  @ManyToOne(() => PlayerEntity, (player) => player.deaths, { eager: true })
  @JoinColumn({ name: 'victim_id' })
  victim: PlayerEntity;

  @Column()
  weapon: string;

  @CreateDateColumn()
  timestamp: Date;
}
