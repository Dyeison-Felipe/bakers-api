type AuditableProps = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type EntityProps = {
  id: string;
  auditable?: AuditableProps;
};

export type BaseProps = Record<string, unknown>;

export abstract class BaseEntity<Props extends BaseProps> {
  readonly props: Props & EntityProps;

  constructor(props: Props & EntityProps) {
    this.props = {
      ...props,
      id: props.id ?? crypto.randomUUID(),
      auditable: {
        createdAt: props.auditable?.createdAt ?? new Date(),
        updatedAt: props.auditable?.updatedAt ?? new Date(),
        deletedAt: props.auditable?.deletedAt ?? null,
      },
    };
    this.validate()
  }

  get id() {
    return this.props.id;
  }

  get auditable() {
    return this.props.auditable;
  }

  protected markAsDeleted() {
  if (this.props.auditable) {
    this.props.auditable.deletedAt = new Date();
  }
}

  protected updateTimestamp() {
		if (this.props.auditable) {
			this.props.auditable.updatedAt = new Date();
		}
	}

  protected abstract validate(): void

  toJSON(): Props & EntityProps {
    return {
      ...this.props,
    };
  }

  static with<Props extends BaseProps, Ent extends BaseEntity<Props>>(
    this: new (props: Props & EntityProps) => Ent,
    props: Props & EntityProps,
  ): Ent {
    return new this(props);
  }
}
