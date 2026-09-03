using Amazon;
using Amazon.Runtime;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace Alpha.Appointment.Api.Services;

public interface IEmailNotificationService
{
    Task<(bool Success, string? MessageId, string? Error)> SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string textBody,
        string? replyTo = null
    );
}

public sealed class AwsSesEmailService(IConfiguration configuration, ILogger<AwsSesEmailService> logger) : IEmailNotificationService
{
    public async Task<(bool Success, string? MessageId, string? Error)> SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string textBody,
        string? replyTo = null
    )
    {
        var awsSection = configuration.GetSection("Aws");
        var fromEmail = awsSection["FromEmail"] ?? "relay@alpha-devs.cloud";
        var accessKey = awsSection["AWS_AccessKey"];
        var secretKey = awsSection["AWS_SecretAccessKey"];
        var regionName = awsSection["AWS_Region"] ?? "us-east-1";

        if (string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey))
        {
            logger.LogWarning("AWS SES credentials missing in configuration. Email to {To} logged in simulation mode: {Subject}", toEmail, subject);
            return (true, $"sim_{Guid.NewGuid():N}", null);
        }

        try
        {
            var credentials = new BasicAWSCredentials(accessKey, secretKey);
            var region = RegionEndpoint.GetBySystemName(regionName);
            using var client = new AmazonSimpleEmailServiceClient(credentials, region);

            var sendRequest = new SendEmailRequest
            {
                Source = fromEmail,
                Destination = new Destination
                {
                    ToAddresses = [toEmail]
                },
                Message = new Message
                {
                    Subject = new Content(subject),
                    Body = new Body
                    {
                        Html = new Content
                        {
                            Charset = "UTF-8",
                            Data = htmlBody
                        },
                        Text = new Content
                        {
                            Charset = "UTF-8",
                            Data = textBody
                        }
                    }
                }
            };

            if (!string.IsNullOrWhiteSpace(replyTo))
            {
                sendRequest.ReplyToAddresses = [replyTo];
            }

            var response = await client.SendEmailAsync(sendRequest);
            logger.LogInformation("AWS SES email sent successfully to {To} with MessageId {MessageId}", toEmail, response.MessageId);
            return (true, response.MessageId, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email via AWS SES to {To}", toEmail);
            return (false, null, ex.Message);
        }
    }
}
