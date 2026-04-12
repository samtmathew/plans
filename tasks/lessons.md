# Lessons Learned

- When carrying over complex UI structures like the "Create Plan" sections over to "Edit Plan", it is often much faster and more resilient to clone the entire form's TSX skeleton and adapt the default values and update logic, rather than retrofitting the old edit form block by block.
- Be careful with implicit API updates in a `PUT` endpoint block. Replacing an arbitrary intersection of relational data (`attendee_ids` against `plan_attendees`) requires computing deterministic disjoint sets (`idsToAdd` vs `idsToRemove`) and safeguarding specific invariant roles (e.g., never removing the `organiser` inadvertently).
