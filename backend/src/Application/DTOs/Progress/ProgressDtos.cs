namespace GymSaaS.Application.DTOs.Progress;

public sealed record ProgressRecordDto(
    Guid Id,
    Guid MemberId,
    DateOnly Date,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? BodyFatPercentage,
    string? RecordedBy);

public sealed record AddProgressRecordRequest(
    Guid MemberId,
    DateOnly Date,
    decimal? WeightKg,
    decimal? ChestCm,
    decimal? WaistCm,
    decimal? HipCm,
    decimal? BodyFatPercentage);

public sealed record ProgressGoalDto(
    Guid Id,
    Guid MemberId,
    string Title,
    decimal? TargetValue,
    string? Unit,
    DateOnly? TargetDate,
    bool Completed,
    DateTimeOffset CreatedAt);

public sealed record AddProgressGoalRequest(
    Guid MemberId,
    string Title,
    decimal? TargetValue,
    string? Unit,
    DateOnly? TargetDate);

public sealed record ProgressNoteDto(
    Guid Id,
    Guid MemberId,
    string Text,
    string? Author,
    DateTimeOffset CreatedAt);

public sealed record AddProgressNoteRequest(Guid MemberId, string Text);

public sealed record ProgressDataDto(
    IReadOnlyList<ProgressRecordDto> Records,
    IReadOnlyList<ProgressGoalDto> Goals,
    IReadOnlyList<ProgressNoteDto> Notes);
