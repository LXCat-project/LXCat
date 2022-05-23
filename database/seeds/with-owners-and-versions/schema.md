# Schema

```mermaid
erDiagram
    User {
        string email
    }
    Organization {
        string name
    }
    CrossSectionSet {
        string name
        string organization FK
    }
    CrossSectionSetPrivate {
        string name
        string from FK "Set under edit"
        string organization FK
        string processes "Inlined cross sections"
    }
    CrossSectionSetArchive {
        string name
        string version
        string commitMessage
        string createdOn
        string current FK "Old version of this set"
        string organization FK
        string processes "Inlined cross sections"
    }
    CrossSectionArchive {
        string name
        string version
        string commitMessage
        string createdOn
        string current FK "Old version of this section"
        string reaction "Inlined reaction"
        string data
    }
    CrossSection {
        string reaction FK
        string data
    }
    User ||--o{ Organization: MemberOf
    Organization ||--o{ CrossSectionSet: Provides
    CrossSectionSetPrivate }|--o| Organization : DraftBy
    CrossSectionSetPrivate ||--o| CrossSectionSet : DraftOf
    CrossSectionSetArchive }o--|{ CrossSectionSet : HistoryOf
    CrossSectionSetArchive }|--|| Organization : HistoryBy
    CrossSectionArchive }o--|{ CrossSection: HistoryOf
    CrossSection }|--|{ CrossSectionSet: IsPartOf
    Reference }|--|{ CrossSection: References
    Reaction }|--|{ State: Produces
    Reaction }|--|{ State: Consumes
    State }o--|{ State: HasDirectSubstate
    Reaction }|--|| CrossSection: react
```

Can be edited on https://mermaid.live/
