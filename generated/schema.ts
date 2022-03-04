// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class TokenStaked extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("by", Value.fromBytes(Bytes.empty()));
    this.set("from", Value.fromBytes(Bytes.empty()));
    this.set("amount", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save TokenStaked entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save TokenStaked entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("TokenStaked", id.toString(), this);
    }
  }

  static load(id: string): TokenStaked | null {
    return changetype<TokenStaked | null>(store.get("TokenStaked", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get by(): Bytes {
    let value = this.get("by");
    return value!.toBytes();
  }

  set by(value: Bytes) {
    this.set("by", Value.fromBytes(value));
  }

  get from(): Bytes {
    let value = this.get("from");
    return value!.toBytes();
  }

  set from(value: Bytes) {
    this.set("from", Value.fromBytes(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    return value!.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }
}

export class TokenUnstaked extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("by", Value.fromBytes(Bytes.empty()));
    this.set("to", Value.fromBytes(Bytes.empty()));
    this.set("amount", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save TokenUnstaked entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save TokenUnstaked entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("TokenUnstaked", id.toString(), this);
    }
  }

  static load(id: string): TokenUnstaked | null {
    return changetype<TokenUnstaked | null>(store.get("TokenUnstaked", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get by(): Bytes {
    let value = this.get("by");
    return value!.toBytes();
  }

  set by(value: Bytes) {
    this.set("by", Value.fromBytes(value));
  }

  get to(): Bytes {
    let value = this.get("to");
    return value!.toBytes();
  }

  set to(value: Bytes) {
    this.set("to", Value.fromBytes(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    return value!.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }
}
