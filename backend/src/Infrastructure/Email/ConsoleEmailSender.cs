using GymSaaS.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace GymSaaS.Infrastructure.Email;

/// <summary>
/// Development email sender: logs the message (including any action link) instead of
/// delivering it. Swap for a real provider (SendGrid/Resend/SES/SMTP) in production by
/// registering a different <see cref="IEmailSender"/> in DependencyInjection.
/// </summary>
public sealed class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL] To: {To} | Subject: {Subject}\n{Body}",
            toEmail,
            subject,
            htmlBody);

        return Task.CompletedTask;
    }
}
