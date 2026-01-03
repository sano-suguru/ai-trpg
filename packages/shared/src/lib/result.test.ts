import { describe, expect, it } from "vitest";
import {
  fromNullable,
  fromPredicate,
  getHttpStatusFromError,
  toErrorResponse,
  tryCatch,
} from "./result";
import { Errors } from "../types/errors";

describe("result utilities", () => {
  describe("fromNullable", () => {
    it("should return ok for non-null value", () => {
      const result = fromNullable("value", Errors.notFound("Test", "id"));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe("value");
    });

    it("should return err for null value", () => {
      const result = fromNullable(null, Errors.notFound("Test", "id"));
      expect(result.isErr()).toBe(true);
    });

    it("should return err for undefined value", () => {
      const result = fromNullable(undefined, Errors.notFound("Test", "id"));
      expect(result.isErr()).toBe(true);
    });
  });

  describe("fromPredicate", () => {
    it("should return ok when condition is true", () => {
      const result = fromPredicate(
        true,
        () => "success",
        () => Errors.validation("failed"),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe("success");
    });

    it("should return err when condition is false", () => {
      const result = fromPredicate(
        false,
        () => "success",
        () => Errors.validation("failed"),
      );
      expect(result.isErr()).toBe(true);
    });
  });

  describe("tryCatch", () => {
    it("should return ok for successful execution", () => {
      const result = tryCatch(
        () => JSON.parse('{"key": "value"}'),
        () => Errors.validation("Invalid JSON"),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ key: "value" });
    });

    it("should return err when function throws", () => {
      const result = tryCatch(
        () => JSON.parse("invalid json"),
        () => Errors.validation("Invalid JSON"),
      );
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getHttpStatusFromError", () => {
    it("should return 401 for UNAUTHORIZED", () => {
      expect(getHttpStatusFromError(Errors.unauthorized())).toBe(401);
    });

    it("should return 404 for NOT_FOUND", () => {
      expect(getHttpStatusFromError(Errors.notFound("User", "123"))).toBe(404);
    });

    it("should return 400 for VALIDATION_ERROR", () => {
      expect(getHttpStatusFromError(Errors.validation("Invalid input"))).toBe(
        400,
      );
    });

    it("should return 500 for DATABASE_ERROR", () => {
      expect(getHttpStatusFromError(Errors.database("read", "error"))).toBe(
        500,
      );
    });
  });

  describe("toErrorResponse", () => {
    it("should convert error to response format", () => {
      const error = Errors.notFound("User", "123");
      const response = toErrorResponse(error);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
      expect(response.body.message).toContain("User");
    });
  });
});
