# Sample Data Migration

## Overview

Migration `000002_seed_sample_data.up.sql` inserts 39 sample monitoring objects into the database.

## Data Inserted

### 1. eNodeB Devices (5 objects)
LTE base stations based on your example data:

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| enb27738 | eNodeB | LTE | virtual | Lester | Nokia |
| enb27742 | eNodeB | LTE | virtual | Lester | Nokia |
| enb27746 | eNodeB | LTE | virtual | Lester | Nokia |
| enb27750 | eNodeB | LTE | virtual | Spinney Hills | Nokia |
| enb27754 | eNodeB | LTE | virtual | Deyn Hills | Nokia |

### 2. gNodeB Devices (3 objects)
5G base stations:

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| gnb28001 | gNodeB | 5G NR | physical | Core Network | Ericsson |
| gnb28002 | gNodeB | 5G NR | physical | Core Network | Ericsson |
| gnb28003 | gNodeB | 5G NR/LTE | physical | Core Network | Huawei |

### 3. Cells (6 objects)
LTE cells for eNodeB stations:

**For enb27738 (Deyn Hills):**
- Cell:7100928-S1
- Cell:7100929-S2
- Cell:7100930-S3

**For enb27742 (Spinney Hills):**
- Cell:7101952-S1
- Cell:7101953-S2
- Cell:7101954-S3

### 4. Centralized Units - CU (3 objects)

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| cu:27738-1 | cu | LTE | virtual | Deyn Hills | Nokia |
| cu:27742-1 | cu | LTE | virtual | Spinney Hills | Nokia |
| cu:28001-1 | cu | 5G NR | physical | Core Network | Ericsson |

### 5. Distributed Units - DU (3 objects)

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| du:27738-1 | du | LTE | virtual | Deyn Hills | Nokia |
| du:27742-1 | du | LTE | virtual | Spinney Hills | Nokia |
| du:28001-1 | du | 5G NR | physical | Core Network | Ericsson |

### 6. Remote Radio Units - RRU (6 objects)

**For Deyn Hills:**
- RRH:27738-001 (LTE, Nokia)
- RRH:27738-002 (LTE, Nokia)
- RRH:27738-003 (LTE, Nokia)

**For Spinney Hills:**
- RRH:27742-001 (LTE, Nokia)
- RRH:27742-002 (LTE, Nokia)
- RRH:27742-003 (LTE, Nokia)

### 7. Routers (3 objects)

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| router-core-01 | router | Cisco IOS-XE | Catalyst 9000 | Core Network | Cisco Systems |
| router-core-02 | router | Cisco IOS-XE | Catalyst 9000 | Core Network | Cisco Systems |
| router-edge-01 | router | Juniper JunOS | MX Series | Edge Network | Juniper Networks |

### 8. Switches (3 objects)

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| switch-access-01 | switch | Cisco IOS | Catalyst 2960 | Access Layer | Cisco Systems |
| switch-access-02 | switch | Cisco IOS | Catalyst 2960 | Access Layer | Cisco Systems |
| switch-core-01 | switch | Arista EOS | DCS-7280 | Core Network | Arista Networks |

### 9. Servers (3 objects)

| Name | Type | Technology | Platform | Network | Manufacturer |
|------|------|------------|----------|---------|--------------|
| server-db-01 | server | Linux Ubuntu | Dell PowerEdge | Data Center | Dell |
| server-app-01 | server | Linux RHEL | HP ProLiant | Data Center | HP |
| server-backup-01 | server | Linux CentOS | Lenovo ThinkSystem | Data Center | Lenovo |

## Total Sample Objects

- **39 monitoring objects** across 9 categories
- Covers all major network element types
- Includes multiple vendors (Nokia, Ericsson, Huawei, Cisco, Juniper, Arista, Dell, HP, Lenovo)
- Represents both 4G (LTE) and 5G (NR) technologies
- Mix of virtual and physical platforms

## How to Apply

### Automatic (Recommended)

The migration will run automatically when you start the Go API:

```bash
cd go-api
go run main.go
```

You'll see in logs:
```
INFO Running database migrations from: db/migrations
INFO Current migration version: 2 (dirty: false)
INFO Database migrations completed successfully
```

### Manual Verification

After starting the API, check the data:

```bash
# Check migration version
docker exec go-service-template-db-1 psql -U user -d appdb -c "SELECT * FROM schema_migrations;"

# Count objects
docker exec go-service-template-db-1 psql -U user -d appdb -c "SELECT COUNT(*) FROM mon_objects;"

# View sample data
docker exec go-service-template-db-1 psql -U user -d appdb -c "SELECT name, type, manufacturer FROM mon_objects LIMIT 10;"
```

## Query Examples

### Get all eNodeB devices:
```sql
SELECT * FROM mon_objects WHERE type = 'eNodeB';
```

### Get all Nokia equipment:
```sql
SELECT * FROM mon_objects WHERE manufacturer = 'Nokia';
```

### Get all objects in Core Network:
```sql
SELECT * FROM mon_objects WHERE network = 'Core Network';
```

### Get objects by technology:
```sql
SELECT * FROM mon_objects WHERE technology LIKE '%LTE%';
```

### Count by type:
```sql
SELECT type, COUNT(*) as count 
FROM mon_objects 
GROUP BY type 
ORDER BY count DESC;
```

## Rollback

If you need to remove the sample data:

```bash
# Rollback last migration
cd go-api
go run main.go # with migration service configured to rollback
```

Or manually:
```sql
DELETE FROM mon_objects WHERE name IN (
  'enb27738', 'enb27742', 'enb27746', 'enb27750', 'enb27754',
  'gnb28001', 'gnb28002', 'gnb28003',
  -- ... (see down migration for full list)
);
```

## Notes

- All UUIDs are auto-generated by the database
- Timestamps (created_at, updated_at) are set to current time
- parent_id and child_id are NULL (can be updated later to establish relationships)
- Data is safe for development and testing
- Can be used to populate your frontend UI immediately

## Next Steps

1. Start your backend: `cd go-api && go run main.go`
2. Start your frontend: `cd frontend && ng serve`
3. Navigate to the feed page
4. You should see 39 objects in the table
5. Use filters to view different categories
6. Use pagination to browse through objects

Enjoy your populated database! 🎉


