import { UtilsError } from "../errors.js";

export class AddressProviderError extends UtilsError {
  override readonly name = "AddressProviderError";
}

export class AddressVerificationError extends UtilsError {
  override readonly name = "AddressVerificationError";
}

export class ProviderNotFoundError extends UtilsError {
  override readonly name = "ProviderNotFoundError";
}
