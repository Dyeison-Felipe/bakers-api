import { ApiProperty } from '@nestjs/swagger';

export class CreateSetupIntentPresenter {
  @ApiProperty({ description: 'Client secret do SetupIntent', type: String })
  readonly clientSecret: string;

  @ApiProperty({ description: 'Id do SetupIntent', type: String })
  readonly setupIntentId: string;

  constructor(props: CreateSetupIntentPresenter) {
    this.clientSecret = props.clientSecret;
    this.setupIntentId = props.setupIntentId;
  }
}
