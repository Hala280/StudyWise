using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudyWise.Domain.Entities;

namespace StudyWise.Infrastructure.Persistence;

public class StudyWiseDbContext : IdentityDbContext<IdentityUser, IdentityRole, string>
{
    public StudyWiseDbContext(DbContextOptions<StudyWiseDbContext> options) : base(options) { }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<StudyBlock> StudyBlocks => Set<StudyBlock>();
    public DbSet<AvailabilityWindow> AvailabilityWindows => Set<AvailabilityWindow>();
    public DbSet<ExamEvent> ExamEvents => Set<ExamEvent>();
    public DbSet<StudyStreak> StudyStreaks => Set<StudyStreak>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Course
        builder.Entity<Course>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Title).IsRequired().HasMaxLength(200);
            e.Property(c => c.Description).HasMaxLength(1000);
            e.HasIndex(c => c.UserId);
        });

        // Topic
        builder.Entity<Topic>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.HasOne(t => t.Course)
             .WithMany(c => c.Topics)
             .HasForeignKey(t => t.CourseId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // StudyBlock
        builder.Entity<StudyBlock>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasOne(s => s.Topic)
             .WithMany(t => t.StudyBlocks)
             .HasForeignKey(s => s.TopicId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(s => new { s.UserId, s.ScheduledDate });
        });

        // AvailabilityWindow
        builder.Entity<AvailabilityWindow>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.UserId, a.DayOfWeek }).IsUnique();
        });

        // ExamEvent
        builder.Entity<ExamEvent>(e =>
        {
            e.HasKey(ex => ex.Id);
            e.Property(ex => ex.Title).IsRequired().HasMaxLength(200);
            e.Property(ex => ex.EventType).IsRequired().HasMaxLength(50);
            e.HasOne(ex => ex.Course)
             .WithMany(c => c.ExamEvents)
             .HasForeignKey(ex => ex.CourseId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // StudyStreak
        builder.Entity<StudyStreak>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.UserId, s.StreakDate }).IsUnique();
        });
    }
}