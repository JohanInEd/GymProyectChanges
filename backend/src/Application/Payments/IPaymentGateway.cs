namespace GymSaaS.Application.Payments;

public interface IPaymentGateway
{
    Task<PaymentGatewayResult> ChargeAsync(PaymentGatewayRequest request, CancellationToken cancellationToken);
}
