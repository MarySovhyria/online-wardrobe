# Domain glossary

Initialized from README/source and the supplied team specification on 2026-10-13.

| Term                        | Meaning                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Clothing item / piece       | One saved garment, accessory or shoe pair, with category, optional name/colour and private image            |
| Category                    | One of top, bottom, jacket (Outerwear), cardigan, hat, shoes, jewelry; distinct from model extraction class |
| Worn photo                  | Photo of someone wearing clothing; segmentation selects visible garment pixels                              |
| Standalone photo            | Clothing item or shoe pair photographed without a person; foreground background removal                     |
| Segmentation                | Label-based pixel selection; does not reconstruct hidden fabric                                             |
| Cutout                      | Cropped clothing image with transparent background, stored as WebP                                          |
| Flat-lay                    | Upright, front-facing garment product image; FLUX can generate one, including estimated hidden fabric       |
| Generated preview           | Reviewable AI image; it may change details and is not stored automatically                                  |
| Outfit selection            | Distinct selected piece IDs, including multiple pieces per category, saved to Supabase                      |
| Outfit composition / layout | Collage position, rotation, scale and flip; persisted in the current browser                                |
| Outfit sheet                | One-page composition exported as a 1600×2240 PNG                                                            |
| Product truth               | Approved vision/requirements/decisions; not inferred from an unreviewed backlog                             |
| Work truth                  | Ticket state, scope, handoffs, criterion evaluations and evidence                                           |
| Product state               | Implemented/partial/missing capability and verification limits in STATE                                     |
| READY                       | Work has passed the applicable preparation gates, not a promise that implementation exists                  |
| DONE                        | Implementation report, agreed QA and artifact closeout satisfy documented gates; not proof of deployment    |

Add terms only when grounded in supplied requirements or current evidence. Keep
category, extraction class, saved selection and local composition distinct.
