import { ApiProperty } from '@nestjs/swagger';

export class RasPiResponse {
  @ApiProperty({ type: String, description: '탑가드 ip' })
  ip: string;

  @ApiProperty({ type: String, description: '탑가드 MAC 주소' })
  mac: string;

  @ApiProperty({ type: String, description: '탑가드 WebRTC URL' })
  webRtcUrl: string;
}
