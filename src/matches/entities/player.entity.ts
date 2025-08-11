import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { KillEntity } from './kill.entity';
import { MatchPlayerEntity } from './match-player.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => MatchPlayerEntity, (mp) => mp.player)
  matchPlayers: MatchPlayerEntity[];

  @OneToMany(() => KillEntity, (kill) => kill.killer)
  kills: KillEntity[];

  @OneToMany(() => KillEntity, (kill) => kill.victim)
  deaths: KillEntity[];
}
