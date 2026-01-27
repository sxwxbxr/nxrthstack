using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using PKHeX.NxrthStack.Web;
using PKHeX.NxrthStack.Core.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Register PKHeX services
builder.Services.AddSingleton<SaveFileService>();
builder.Services.AddSingleton<PokemonService>();

await builder.Build().RunAsync();
