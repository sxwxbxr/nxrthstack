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

    public PKM? GetBoxPokemon(int box, int slot)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return null;

        try
        {
            return save.GetBoxSlotAtIndex(box, slot);
        }
        catch
        {
            return null;
        }
    }

    public void SetBoxPokemon(int box, int slot, PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null) return;

        save.SetBoxSlotAtIndex(pokemon, box, slot);
        _saveService.NotifyModified();
    }

    public void SetPartyPokemon(int slot, PKM pokemon)
    {
        var save = _saveService.CurrentSave;
        if (save == null || slot < 0 || slot >= 6) return;

        save.PartyData[slot] = pokemon;
        _saveService.NotifyModified();
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
        return SpeciesName.GetSpeciesName((ushort)pokemon.Species, (int)LanguageID.English);
    }

    public static string GetSpeciesName(int species)
    {
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
        // Standard competitive spread: 252 HP, 252 Atk, 6 Speed
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

    // Legality checking
    public static bool IsLegal(PKM pokemon)
    {
        var la = new LegalityAnalysis(pokemon);
        return la.Valid;
    }

    public static string GetLegalityReport(PKM pokemon)
    {
        var la = new LegalityAnalysis(pokemon);
        return la.Report();
    }
}
