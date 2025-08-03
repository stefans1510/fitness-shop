using System.Collections.Concurrent;
using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> UserConnetions = new();

        public override Task OnConnectedAsync()
        {
            var email = Context.User?.GetEmail();

            if (!string.IsNullOrEmpty(email)) UserConnetions[email] = Context.ConnectionId;

            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var email = Context.User?.GetEmail();

            if (!string.IsNullOrEmpty(email)) UserConnetions.TryRemove(email, out _);

            return base.OnDisconnectedAsync(exception);
        }

        public static string? GetConnectionIdByEmail(string email)
        {
            UserConnetions.TryGetValue(email, out var connectionId);

            return connectionId;
        }
    }
}