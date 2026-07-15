using GymSaaS.Domain.Entities;

namespace GymSaaS.Application.Abstractions;

public interface IJwtTokenService
{
    string CreateToken(User user);
}
