export class UpdatePlanPresenter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly duration: number;
  readonly active: boolean

  constructor(props: UpdatePlanPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.duration = props.duration;
    this.active = props.active;
  }
}