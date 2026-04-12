# Lessons Learned

- When carrying over complex UI structures like the "Create Plan" sections over to "Edit Plan", it is often much faster and more resilient to clone the entire form's TSX skeleton and adapt the default values and update logic, rather than retrofitting the old edit form block by block.
- Be careful with implicit API updates in a `PUT` endpoint block. Replacing an arbitrary intersection of relational data (`attendee_ids` against `plan_attendees`) requires computing deterministic disjoint sets (`idsToAdd` vs `idsToRemove`) and safeguarding specific invariant roles (e.g., never removing the `organiser` inadvertently).
- When fetching relational data through a bridging table with multiple foreign keys pointing to the same relation (e.g. `user_id` and `invited_by` mapping to `profiles`), Supabase will error on ambiguous joins. Always use the explicit FK target, like `profile:profiles!user_id(id)`.
- Always remember to enforce logical deletions (e.g., `.is('deleted_at', null)`) on `SELECT` queries across all views to prevent phantom records displaying.
