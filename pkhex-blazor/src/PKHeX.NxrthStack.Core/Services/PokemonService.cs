using PKHeX.Core;

namespace PKHeX.NxrthStack.Core.Services;

public class PokemonService
{
    private readonly SaveFileService _saveService;

    public PokemonService(SaveFileService saveService)
    {
        _saveService = saveService;
    }

    public PKM? GetPartyPokemon(int slot)
    {
        var save = _saveService.CurrentSave;
        if (save == null || slot < 0 || slot >= save.PartyCount)
            return null;
        return save.PartyData[slot];
    }

    public IList<PKM> GetPartyData()
    {
        return _saveService.CurrentSave?.PartyData ?? Array.Empty<PKM>();
    }

    public int GetPartyCount()
    {
        return _saveService.CurrentSave?.PartyCount ?? 0;
    }

    public PKM? GetBoxPokemon(int box, int slot)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return null;

        try
        {
            // Calculate the absolute slot index
            int slotsPerBox = save.BoxSlotCount;
            int absoluteSlot = (box * slotsPerBox) + slot;

            // Use GetBoxSlotAtIndex if available, otherwise use BoxData
            if (absoluteSlot < save.BoxData.Count)
            {
                return save.BoxData[absoluteSlot];
            }
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting box pokemon: {ex.Message}");
            return null;
        }
    }

    public void SetBoxPokemon(int box, int slot, PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return;

        try
        {
            // Use PKHeX.Core's proper method to set box slot
            // This ensures the data is written back to the save file's internal storage
            save.SetBoxSlotAtIndex(pokemon, box, slot);
            _saveService.NotifyModified();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error setting box pokemon: {ex.Message}");
        }
    }

    public void SetPartyPokemon(int slot, PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null || slot < 0 || slot >= 6) return;

        try
        {
            // Use PKHeX.Core's proper method to set party slot
            save.SetPartySlotAtIndex(pokemon, slot);
            _saveService.NotifyModified();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error setting party pokemon: {ex.Message}");
        }
    }

    public int GetBoxPokemonCount(int box)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return 0;

        int count = 0;
        int slotsPerBox = save.BoxSlotCount;

        for (int i = 0; i < slotsPerBox; i++)
        {
            var pk = GetBoxPokemon(box, i);
            if (pk != null && pk.Species > 0)
                count++;
        }
        return count;
    }

    public IEnumerable<PKM> GetAllBoxPokemon(int box)
    {
        var save = _saveService.CurrentSave;
        if (save == null) yield break;

        var slotsPerBox = save.BoxSlotCount;
        for (int i = 0; i < slotsPerBox; i++)
        {
            var pk = GetBoxPokemon(box, i);
            if (pk != null && pk.Species > 0)
                yield return pk;
        }
    }

    public static string GetSpeciesName(PKM pokemon)
    {
        if (pokemon.Species <= 0) return "Empty";
        return SpeciesName.GetSpeciesName((ushort)pokemon.Species, (int)LanguageID.English);
    }

    public static string GetSpeciesName(int species)
    {
        if (species <= 0) return "Empty";
        return SpeciesName.GetSpeciesName((ushort)species, (int)LanguageID.English);
    }

    public static bool IsShiny(PKM pokemon) => pokemon.IsShiny;

    public static void ToggleShiny(PKM pokemon)
    {
        if (pokemon.IsShiny)
            pokemon.SetUnshiny();
        else
            pokemon.SetShiny();
    }

    public static void SetIVs(PKM pokemon, int hp, int atk, int def, int spa, int spd, int spe)
    {
        pokemon.IV_HP = hp;
        pokemon.IV_ATK = atk;
        pokemon.IV_DEF = def;
        pokemon.IV_SPA = spa;
        pokemon.IV_SPD = spd;
        pokemon.IV_SPE = spe;
    }

    public static void MaxIVs(PKM pokemon)
    {
        SetIVs(pokemon, 31, 31, 31, 31, 31, 31);
    }

    public static void SetEVs(PKM pokemon, int hp, int atk, int def, int spa, int spd, int spe)
    {
        pokemon.EV_HP = hp;
        pokemon.EV_ATK = atk;
        pokemon.EV_DEF = def;
        pokemon.EV_SPA = spa;
        pokemon.EV_SPD = spd;
        pokemon.EV_SPE = spe;
    }

    public static void MaxEVs(PKM pokemon)
    {
        SetEVs(pokemon, 252, 252, 0, 0, 0, 6);
    }

    public static void ClearEVs(PKM pokemon)
    {
        SetEVs(pokemon, 0, 0, 0, 0, 0, 0);
    }

    public static void SetLevel(PKM pokemon, int level)
    {
        pokemon.CurrentLevel = (byte)level;
    }

    public static void MaxLevel(PKM pokemon)
    {
        pokemon.CurrentLevel = 100;
    }

    public static void SetMove(PKM pokemon, int moveSlot, int moveId)
    {
        switch (moveSlot)
        {
            case 0: pokemon.Move1 = (ushort)moveId; break;
            case 1: pokemon.Move2 = (ushort)moveId; break;
            case 2: pokemon.Move3 = (ushort)moveId; break;
            case 3: pokemon.Move4 = (ushort)moveId; break;
        }
    }

    public static int[] GetMoves(PKM pokemon)
    {
        return [pokemon.Move1, pokemon.Move2, pokemon.Move3, pokemon.Move4];
    }

    public static string GetMoveName(int moveId)
    {
        if (moveId <= 0) return "---";
        var names = GameInfo.Strings.movelist;
        return moveId < names.Length ? names[moveId] : $"Move {moveId}";
    }

    public static string GetAbilityName(PKM pokemon)
    {
        var abilityId = pokemon.Ability;
        var names = GameInfo.Strings.abilitylist;
        return abilityId < names.Length ? names[abilityId] : $"Ability {abilityId}";
    }

    public static string GetNatureName(PKM pokemon)
    {
        var natureId = (int)pokemon.Nature;
        var names = GameInfo.Strings.natures;
        return natureId < names.Length ? names[natureId] : $"Nature {natureId}";
    }

    public static string GetItemName(PKM pokemon)
    {
        var itemId = pokemon.HeldItem;
        if (itemId <= 0) return "None";
        var names = GameInfo.Strings.itemlist;
        return itemId < names.Length ? names[itemId] : $"Item {itemId}";
    }

    public static string GetItemName(int itemId)
    {
        if (itemId <= 0) return "None";
        var names = GameInfo.Strings.itemlist;
        return itemId < names.Length ? names[itemId] : $"Item {itemId}";
    }

    public static bool IsLegal(PKM pokemon)
    {
        try
        {
            var la = new LegalityAnalysis(pokemon);
            return la.Valid;
        }
        catch
        {
            return true; // Assume legal if check fails
        }
    }

    public static string GetLegalityReport(PKM pokemon)
    {
        try
        {
            var la = new LegalityAnalysis(pokemon);
            return la.Report();
        }
        catch
        {
            return "Unable to check legality";
        }
    }

    // Create a new Pokemon
    public PKM? CreatePokemon(ushort species, int level = 5)
    {
        var save = _saveService.CurrentSave;
        if (save == null || species <= 0) return null;

        try
        {
            // Create a blank Pokemon for this save type
            var pk = EntityBlank.GetBlank(save);

            pk.Species = species;
            pk.CurrentLevel = (byte)Math.Clamp(level, 1, 100);

            // Set basic properties
            pk.OriginalTrainerName = save.OT;
            pk.TID16 = save.TID16;
            pk.SID16 = save.SID16;
            pk.OriginalTrainerGender = (byte)save.Gender;
            pk.Language = save.Language;
            pk.MetLevel = (byte)level;
            pk.MetDate = DateOnly.FromDateTime(DateTime.Now);

            // Set a valid met location (generic "from a link trade" works across games)
            pk.MetLocation = GetDefaultMetLocation(save);

            // Set experience for the level
            pk.EXP = Experience.GetEXP(pk.CurrentLevel, pk.PersonalInfo.EXPGrowth);

            // Give it a legal moveset
            var moves = GetLegalMoves(pk);
            if (moves.Length > 0) pk.Move1 = moves[0];
            if (moves.Length > 1) pk.Move2 = moves[1];
            if (moves.Length > 2) pk.Move3 = moves[2];
            if (moves.Length > 3) pk.Move4 = moves[3];

            // Heal to full
            pk.HealPP();
            pk.CurrentFriendship = pk.PersonalInfo.BaseFriendship;

            // Set PID and encryption constant
            pk.PID = Util.Rand32();
            if (pk is IEncounterTemplate enc)
            {
                pk.EncryptionConstant = Util.Rand32();
            }

            // Refresh checksum
            pk.RefreshChecksum();

            return pk;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating pokemon: {ex.Message}");
            return null;
        }
    }

    private static ushort GetDefaultMetLocation(SaveFile save)
    {
        // Return a sensible default met location based on generation
        return save.Generation switch
        {
            1 or 2 => 0,
            3 => 254, // Fateful encounter
            4 => 2001, // Link trade (met in another game)
            5 => 30003, // Link trade
            6 => 30002, // Link trade
            7 => 30002, // Link trade
            8 => 30002, // Link trade
            9 => 30024, // Link trade
            _ => 0
        };
    }

    private static ushort[] GetLegalMoves(PKM pk)
    {
        // Give a basic moveset - Tackle (33) and Growl (45) are common starting moves
        // Users can edit moves later if needed
        return [(ushort)33, (ushort)45];
    }

    public bool AddPokemonToParty(PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null || pokemon == null) return false;

        try
        {
            // Find first empty party slot
            var partyCount = save.PartyCount;
            if (partyCount >= 6) return false; // Party is full

            save.SetPartySlotAtIndex(pokemon, partyCount);
            _saveService.NotifyModified();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding to party: {ex.Message}");
            return false;
        }
    }

    public bool AddPokemonToBox(int box, int slot, PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null || pokemon == null) return false;

        try
        {
            save.SetBoxSlotAtIndex(pokemon, box, slot);
            _saveService.NotifyModified();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding to box: {ex.Message}");
            return false;
        }
    }

    public int FindFirstEmptyBoxSlot(int box)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return -1;

        var slotsPerBox = save.BoxSlotCount;
        for (int i = 0; i < slotsPerBox; i++)
        {
            var pk = GetBoxPokemon(box, i);
            if (pk == null || pk.Species == 0)
                return i;
        }
        return -1; // Box is full
    }

    // Get all species names for selection
    public static IEnumerable<(ushort Id, string Name)> GetAllSpecies()
    {
        var names = GameInfo.Strings.specieslist;
        for (ushort i = 1; i < names.Length; i++)
        {
            if (!string.IsNullOrEmpty(names[i]))
                yield return (i, names[i]);
        }
    }
}
