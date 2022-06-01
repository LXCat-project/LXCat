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
        string isComplete "Self consistent set which can be used in calculations"
        string organization FK
        string status "draft | published | archived | retracted"
        string version
        string commitMessage
    }
    CrossSection {
        string reaction FK
        string data
        string organization FK
        string status "draft | published | archived | retracted"
        string version
        string commitMessage
    }
    User ||--o{ MemberOf: from
    MemberOf |o--|{ Organization: to
    Organization ||--o{ CrossSectionSet: Provides
    CrossSectionSet ||--|{ CrossSectionSetHistory: from
    CrossSectionSet ||--|{ CrossSectionSetHistory: to
    CrossSection ||--|{ IsPartOf: from
    IsPartOf }|--|| CrossSectionSet: to
    Organization ||--o{ CrossSection: Provides
    CrossSection ||--|{ CrossSectionHistory: from
    CrossSection ||--|{ CrossSectionHistory: to
    Reference ||--|{ References: to
    References }|--|| CrossSection: from
    Reaction ||--|{ Produces: from
    Produces }|--|| State: to
    Reaction ||--|{ Consumes: from
    Consumes }|--|| State: to
    State |o--|{ HasDirectSubstate: from
    HasDirectSubstate ||--|{ State: to
    Reaction }|--|| CrossSection: reaction
```

Can be edited on https://mermaid.live/
