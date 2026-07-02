using Microsoft.EntityFrameworkCore;
using UniVibe.Domain.Common;
using UniVibe.Domain.Entities;

namespace UniVibe.Infrastructure.Persistence.Context
{
    public class UniVibeDbContext : DbContext
    {
        public UniVibeDbContext(DbContextOptions<UniVibeDbContext> options) : base(options)
        {

        }

        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<PendingUser> PendingUsers { get; set; }
        public DbSet<EventCategory> EventCategories { get; set; }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (var entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        entry.Entity.IsActive = true;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Email).HasMaxLength(50).IsRequired();
                entity.Property(u => u.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(u => u.LastName).HasMaxLength(50).IsRequired();
                entity.Property(u => u.PhoneNumber).HasMaxLength(20);
                entity.Property(u => u.Username).HasMaxLength(20).IsRequired();
                entity.HasIndex(u => u.Username).IsUnique();
            });


            modelBuilder.Entity<Event>(entity =>
            {
                entity.Property(e => e.Title).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.Location).HasMaxLength(200);
            });
        }
    }
}
