using System.Security.Claims;

namespace UniVibe.Application.Common
{
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? user.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                throw new UnauthorizedAccessException("Kullanıcı kimliği bulunamadı.");

            if (!Guid.TryParse(userId, out var parsedGuid) || parsedGuid == Guid.Empty)
                throw new UnauthorizedAccessException("Kullanıcı kimliği geçersiz formatta.");

            return parsedGuid;
        }
    }
}