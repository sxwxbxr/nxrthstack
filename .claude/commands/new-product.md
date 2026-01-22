# New Product Generator

Generate all necessary data to create a new product in the NxrthStack admin dashboard.

## Instructions

When the user runs `/new-product`, ask them these questions one at a time using AskUserQuestion:

1. **Product Name**: What is the name of the product?
2. **Product Type**: Is this a Free download, Paid license, or Subscription?
3. **Brief Description**: What does this product do? (1-2 sentences for the user to describe)

Then generate the following data automatically:

### Generate These Fields:

1. **slug**: Auto-generate from product name (lowercase, hyphens, no special chars)
2. **shortDescription**: A compelling 1-sentence marketing description (max 150 chars)
3. **description**: A full marketing description with:
   - Opening hook paragraph
   - Key features list (5-7 bullet points)
   - Who it's for paragraph
   - Call to action
4. **Pricing Tiers** (for Paid/Subscription products):
   - **Basic/Starter**: Entry-level tier with core features
   - **Pro/Plus**: Mid-tier with additional features
   - **Enterprise/Team**: Premium tier with all features
   - Include 4-6 features per tier
   - Suggest realistic prices based on product type

### Output Format:

Present the generated data in a clear format the user can copy into the admin dashboard:

```
📦 PRODUCT DATA FOR ADMIN DASHBOARD
=====================================

Name: [Product Name]
Slug: [generated-slug]
Type: [Free/Paid/Subscription]

Short Description:
[Generated short description]

Full Description:
[Generated full description with markdown formatting]

---

💰 PRICING TIERS (copy these into the Pricing Manager)

Tier 1: [Name]
- Price: $XX
- Billing: [One-time / Monthly / Annual]
- Features:
  ✓ Feature 1
  ✓ Feature 2
  ✓ Feature 3
  ✓ Feature 4

Tier 2: [Name]
- Price: $XX
- Billing: [One-time / Monthly / Annual]
- Features:
  ✓ All Basic features
  ✓ Feature 5
  ✓ Feature 6
  ✓ Feature 7

Tier 3: [Name]
- Price: $XX
- Billing: [One-time / Monthly / Annual]
- Features:
  ✓ All Pro features
  ✓ Feature 8
  ✓ Feature 9
  ✓ Priority support
```

### Guidelines:

- Make descriptions professional and compelling
- Use action verbs and benefit-focused language
- Price suggestions should be realistic for software products:
  - Free: $0
  - Paid one-time: $19-$199 range
  - Subscriptions: $5-$50/month range
- Features should be specific and valuable, not generic
- For free products, still suggest feature lists for the product page

After generating, ask if the user wants any modifications before they copy the data.
