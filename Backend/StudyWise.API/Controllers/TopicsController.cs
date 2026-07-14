using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using StudyWise.Application.DTOs.Topics;
using StudyWise.Application.Interfaces;

namespace StudyWise.API.Controllers;

[Microsoft.AspNetCore.Authorization.Authorize]
[ApiController]
[Route("api/courses/{courseId}/[controller]")]
public class TopicsController : ControllerBase
{
    private readonly ITopicService _topicService;

    public TopicsController(ITopicService topicService)
    {
        _topicService = topicService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        var topics = await _topicService.GetByCourseAsync(courseId, CurrentUserId);
        return Ok(topics);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int courseId, int id)
    {
        var topic = await _topicService.GetByIdAsync(id, CurrentUserId);
        if (topic is null) return NotFound();
        return Ok(topic);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int courseId, [FromBody] CreateTopicDto dto)
    {
        var topic = await _topicService.CreateAsync(courseId, dto, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { courseId, id = topic.Id }, topic);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int courseId, int id, [FromBody] UpdateTopicDto dto)
    {
        var topic = await _topicService.UpdateAsync(id, dto, CurrentUserId);
        if (topic is null) return NotFound();
        return Ok(topic);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int courseId, int id)
    {
        var result = await _topicService.DeleteAsync(id, CurrentUserId);
        if (!result) return NotFound();
        return NoContent();
    }
}
