import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pokemonSpecies } from "@/lib/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const generation = searchParams.get("generation");
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereConditions = [eq(pokemonSpecies.isActive, true)];

    if (search) {
      whereConditions.push(ilike(pokemonSpecies.name, `%${search}%`));
    }

    if (generation) {
      whereConditions.push(eq(pokemonSpecies.generation, parseInt(generation)));
    }

    const species = await db.query.pokemonSpecies.findMany({
      where: and(...whereConditions),
      limit,
      orderBy: (species, { asc }) => [asc(species.pokedexId)],
    });

    return NextResponse.json({ species });
  } catch (error) {
    console.error("Error fetching Pokemon species:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pokemon species" },
      { status: 500 }
    );
  }
}
