export class FindAllPlanPresenter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly duration: number;
  readonly active: boolean
  readonly userLimit: number | null;

  constructor(props: FindAllPlanPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.duration = props.duration;
    this.active = props.active;
    this.userLimit = props.userLimit;
  }
}