using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudyWise.Application.DTOs.StudyBlocks;
using StudyWise.Application.Interfaces;

namespace StudyWise.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StudyBlocksController : ControllerBase
{
    private readonly IStudyBlockService _studyBlockService;

    public StudyBlocksController(IStudyBlockService studyBlockService)
    {
        _studyBlockService = studyBlockService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateOnly? startDate, [FromQuery] DateOnly? endDate)
    {
        var blocks = await _studyBlockService.GetAsync(CurrentUserId, startDate, endDate);
        return Ok(blocks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var block = await _studyBlockService.GetByIdAsync(id, CurrentUserId);
        if (block is null) return NotFound();
        return Ok(block);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudyBlockDto dto)
    {
        var block = await _studyBlockService.CreateAsync(dto, CurrentUserId);
        if (block is null) return NotFound();
        return CreatedAtAction(nameof(GetById), new { id = block.Id }, block);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateStudyBlockDto dto)
    {
        var block = await _studyBlockService.UpdateAsync(id, dto, CurrentUserId);
        if (block is null) return NotFound();
        return Ok(block);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _studyBlockService.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
