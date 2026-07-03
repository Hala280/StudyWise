using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudyWise.API.Models;

namespace StudyWise.API.Data;

public class StudyWiseDbContext : IdentityDbContext<ApplicationUser>
{
    public StudyWiseDbContext(DbContextOptions<StudyWiseDbContext> options)
        : base(options) { }

    public DbSet<Course> Courses { get; set; }
    public DbSet<Topic> Topics { get; set; }
    public DbSet<AvailabilityWindow> AvailabilityWindows { get; set; }
    public DbSet<StudyBlock> StudyBlocks { get; set; }
    public DbSet<ExamEvent> ExamEvents { get; set; }
    public DbSet<StudyStreak> StudyStreaks { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);


        // Course → cascade delete Topics and ExamEvents
        builder.Entity<Course>()
            .HasMany(c => c.Topics)
            .WithOne(t => t.Course)
            .HasForeignKey(t => t.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Topic → cascade delete StudyBlocks
        builder.Entity<Topic>()
            .HasMany(t => t.StudyBlocks)
            .WithOne(sb => sb.Topic)
            .HasForeignKey(sb => sb.TopicId)
            .OnDelete(DeleteBehavior.Cascade);


        // User → StudyBlocks: restrict (not cascade) to avoid
        // multiple cascade paths SQL Server doesn't allow
        builder.Entity<StudyBlock>()
            .HasOne(sb => sb.User)
            .WithMany(u => u.StudyBlocks)
            .HasForeignKey(sb => sb.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Same for ExamEvents
        builder.Entity<ExamEvent>()
            .HasOne(e => e.User)
            .WithMany(u => u.ExamEvents)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}