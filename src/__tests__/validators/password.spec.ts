import { passwordValidator } from "@work-whiz/validators/password.validator";

describe("passwordValidator", () => {
  it("should return undefined for a strong valid password", () => {
    const password = "ValidPassw0rd!";
    const error = passwordValidator(password);
    expect(error).toBeUndefined();
  });

  it("should return error for empty password", () => {
    const error = passwordValidator("");
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe("Please enter a password.");
  });

  it("should return error for password shorter than 12 characters", () => {
    const error = passwordValidator("Abc1!");
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.message === "Password should be at least 12 characters long.")).toBe(true);
  });

  it("should return error for password longer than 64 characters", () => {
    const longPassword = "A1!".repeat(22) + "Extra";
    const error = passwordValidator(longPassword);
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.message === "Password should not exceed 64 characters.")).toBe(true);
  });

  it("should return error for missing uppercase letters", () => {
    const error = passwordValidator("validpassword1!");
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  });

  it("should return error for missing lowercase letters", () => {
    const error = passwordValidator("VALIDPASSWORD1!");
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  });

  it("should return error for missing digits", () => {
    const error = passwordValidator("ValidPassword!");
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  });

  it("should return error for missing special characters", () => {
    const error = passwordValidator("ValidPassword1");
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  });

  it("should return error if input is null or undefined", () => {
    const error1 = passwordValidator(null as unknown as string);
    const error2 = passwordValidator(undefined as unknown as string);
    expect(error1).toBeDefined();
    expect(error2).toBeDefined();
    expect(error2?.details[0].message).toBe("Password is required.");
  });
});
