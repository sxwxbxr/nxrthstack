using PKHeX.Core;

namespace PKHeX.NxrthStack.Core.Services;

public class SaveFileService
{
    private SaveFile? _currentSave;

    public SaveFile? CurrentSave => _currentSave;

    public event Action? OnSaveLoaded;
    public event Action? OnSaveModified;

    public SaveFile? LoadSave(byte[] data)
    {
        try
        {
            _currentSave = SaveUtil.GetVariantSAV(data);
            if (_currentSave != null)
            {
                OnSaveLoaded?.Invoke();
            }
            return _currentSave;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading save: {ex.Message}");
            return null;
        }
    }

    public byte[]? ExportSave()
    {
        return _currentSave?.Write();
    }

    public void NotifyModified()
    {
        OnSaveModified?.Invoke();
    }

    public GameVersion GetGameVersion() => _currentSave?.Version ?? GameVersion.Invalid;

    public int GetGeneration() => _currentSave?.Generation ?? 0;

    public string GetGameName() => _currentSave?.Version.ToString() ?? "Unknown";

    public string GetTrainerName() => _currentSave?.OT ?? "Unknown";

    public int GetTrainerID() => (int)(_currentSave?.TID16 ?? 0);

    public int GetSecretID() => (int)(_currentSave?.SID16 ?? 0);

    public int GetMoney() => (int)(_currentSave?.Money ?? 0);

    public int GetPlayedHours() => _currentSave?.PlayedHours ?? 0;

    public int GetPartyCount() => _currentSave?.PartyCount ?? 0;

    public int GetBoxCount() => _currentSave?.BoxCount ?? 0;

    public int GetSlotsPerBox() => _currentSave?.BoxSlotCount ?? 30;

    public string GetBoxName(int box)
    {
        if (_currentSave == null || box < 0 || box >= _currentSave.BoxCount)
            return $"Box {box + 1}";
        // Box names are stored differently across generations
        // For now, return a simple name
        return $"Box {box + 1}";
    }
}
