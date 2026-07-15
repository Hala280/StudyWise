using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using StudyWise.Application.Interfaces;
using StudyWise.Infrastructure.Parsing;
using StudyWise.Infrastructure.Persistence;
using StudyWise.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDevClient", policy =>
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddDbContext<StudyWiseDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ITopicService, TopicService>();
builder.Services.AddScoped<IStudyBlockService, StudyBlockService>();

builder.Services.AddHttpClient<GeminiSyllabusParser>();

builder.Services
    .AddIdentityApiEndpoints<IdentityUser<Guid>>()
    .AddEntityFrameworkStores<StudyWiseDbContext>();

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AngularDevClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<IdentityUser<Guid>>();
app.MapControllers();

app.Run();
