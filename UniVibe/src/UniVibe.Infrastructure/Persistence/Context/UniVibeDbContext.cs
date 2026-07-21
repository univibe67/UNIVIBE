using Microsoft.EntityFrameworkCore;
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
        public DbSet<Faculty> Faculties { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<University> Universities { get; set; }
        public DbSet<EventAttendee> EventAttendees { get; set; }

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

            modelBuilder.Entity<Faculty>()
            .HasOne(f => f.University)
            .WithMany(u => u.Faculties)
            .HasForeignKey(f => f.UniversityId)
            .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<University>(entity =>
            {
                entity.Property(u => u.Name).HasMaxLength(150).IsRequired();
                entity.Property(u => u.EmailDomain).HasMaxLength(50).IsRequired();
            });

            modelBuilder.Entity<Faculty>(entity =>
            {
                entity.Property(f => f.Name).HasMaxLength(100).IsRequired();
            });

            modelBuilder.Entity<Department>(entity =>
            {
                entity.Property(d => d.Name).HasMaxLength(100).IsRequired();

                entity.HasOne(d => d.Faculty)
                      .WithMany(f => f.Departments)
                      .HasForeignKey(d => d.FacultyId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Email).HasMaxLength(50).IsRequired();
                entity.Property(u => u.FirstName).HasMaxLength(50).IsRequired();
                entity.Property(u => u.LastName).HasMaxLength(50).IsRequired();
                entity.Property(u => u.PhoneNumber).HasMaxLength(20);
                entity.Property(u => u.Username).HasMaxLength(20).IsRequired();
                entity.HasIndex(u => u.Username).IsUnique();

                entity.HasOne(u => u.Department)
                      .WithMany(d => d.Users)
                      .HasForeignKey(u => u.DepartmentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Event>(entity =>
            {
                entity.Property(e => e.Title).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.Location).HasMaxLength(200);
            });

            modelBuilder.Entity<EventAttendee>(entity =>
            {
                entity.HasKey(ea => ea.Id);

                entity.HasOne(ea => ea.Event)
                      .WithMany(e => e.Attendees)
                      .HasForeignKey(ea => ea.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ea => ea.User)
                      .WithMany()
                      .HasForeignKey(ea => ea.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}