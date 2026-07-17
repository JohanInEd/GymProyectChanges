namespace GymSaaS.Application.DTOs.Auth;

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Token, string Password);

public sealed record VerifyEmailRequest(string Token);
