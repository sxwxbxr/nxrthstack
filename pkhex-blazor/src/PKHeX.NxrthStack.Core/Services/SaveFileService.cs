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

    public void ClearSave()
    {
        _currentSave = null;
    }

    public byte[]? ExportSave()
    {
        return _currentSave?.Write();
    }

    public void NotifyModified()
    {
        OnSaveModified?.Invoke();
    }

    // Game Info
    public GameVersion GetGameVersion() => _currentSave?.Version ?? GameVersion.Invalid;
    public int GetGeneration() => _currentSave?.Generation ?? 0;
    public string GetGameName() => _currentSave?.Version.ToString() ?? "Unknown";

    // Trainer Info
    public string GetTrainerName() => _currentSave?.OT ?? "Unknown";

    public void SetTrainerName(string name)
    {
        if (_currentSave != null)
        {
            _currentSave.OT = name;
            NotifyModified();
        }
    }

    public int GetTrainerID() => (int)(_currentSave?.TID16 ?? 0);

    public void SetTrainerID(int tid)
    {
        if (_currentSave != null)
        {
            _currentSave.TID16 = (ushort)tid;
            NotifyModified();
        }
    }

    public int GetSecretID() => (int)(_currentSave?.SID16 ?? 0);

    public void SetSecretID(int sid)
    {
        if (_currentSave != null)
        {
            _currentSave.SID16 = (ushort)sid;
            NotifyModified();
        }
    }

    // Money
    public uint GetMoney() => _currentSave?.Money ?? 0;

    public void SetMoney(uint money)
    {
        if (_currentSave != null)
        {
            _currentSave.Money = money;
            NotifyModified();
        }
    }

    public uint GetMaxMoney() => (uint)(_currentSave?.MaxMoney ?? 999999);

    // Play Time
    public int GetPlayedHours() => _currentSave?.PlayedHours ?? 0;
    public int GetPlayedMinutes() => _currentSave?.PlayedMinutes ?? 0;
    public int GetPlayedSeconds() => _currentSave?.PlayedSeconds ?? 0;

    public void SetPlayedTime(int hours, int minutes, int seconds)
    {
        if (_currentSave != null)
        {
            _currentSave.PlayedHours = hours;
            _currentSave.PlayedMinutes = minutes;
            _currentSave.PlayedSeconds = seconds;
            NotifyModified();
        }
    }

    // Pokemon counts
    public int GetPartyCount() => _currentSave?.PartyCount ?? 0;
    public int GetBoxCount() => _currentSave?.BoxCount ?? 0;
    public int GetSlotsPerBox() => _currentSave?.BoxSlotCount ?? 30;

    public string GetBoxName(int box)
    {
        if (_currentSave == null || box < 0 || box >= _currentSave.BoxCount)
            return $"Box {box + 1}";
        return $"Box {box + 1}";
    }

    // Gender (if supported)
    public int GetTrainerGender()
    {
        if (_currentSave == null) return 0;
        return _currentSave.Gender;
    }

    public void SetTrainerGender(int gender)
    {
        if (_currentSave != null)
        {
            _currentSave.Gender = (byte)gender;
            NotifyModified();
        }
    }

    // Language
    public int GetLanguage() => _currentSave?.Language ?? 2; // English default

    public void SetLanguage(int language)
    {
        if (_currentSave != null)
        {
            _currentSave.Language = language;
            NotifyModified();
        }
    }
}
