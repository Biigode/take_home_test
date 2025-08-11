import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MatchEntity } from './match.entity';
import { PlayerEntity } from './player.entity';

@Entity('match_players')
export class MatchPlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MatchEntity, (match) => match.players)
  @JoinColumn({ name: 'match_id' })
  match: MatchEntity;

  @ManyToOne(() => PlayerEntity, (player) => player.matchPlayers, {
    eager: true,
  })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ default: 0 })
  kills: number;

  @Column({ default: 0 })
  deaths: number;
}
