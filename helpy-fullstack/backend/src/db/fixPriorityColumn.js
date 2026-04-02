import 'dotenv/config';
import { sequelize } from './sequelize.js';

async function fixPriorityColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Check if the column exists and its current type
    const [results] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topics' 
      AND column_name = 'priority';
    `);

    if (results.length === 0) {
      console.log('Priority column does not exist. It will be created by Sequelize sync.');
      process.exit(0);
    }

    const currentType = results[0].data_type;
    console.log(`Current priority column type: ${currentType}`);

    if (currentType === 'integer' || currentType === 'bigint' || currentType === 'smallint') {
      console.log('Converting priority column from INTEGER to VARCHAR...');
      
      // Use a two-step approach: add temp column, migrate data, swap columns
      await sequelize.query(`
        ALTER TABLE topics 
        ADD COLUMN priority_temp VARCHAR(20);
      `);

      // Migrate existing integer values to string equivalents
      await sequelize.query(`
        UPDATE topics 
        SET priority_temp = CASE 
          WHEN priority = 0 THEN 'LOW'
          WHEN priority = 1 THEN 'MEDIUM'
          WHEN priority = 2 THEN 'HIGH'
          WHEN priority = 3 THEN 'CRITICAL'
          ELSE 'LOW'
        END
        WHERE priority IS NOT NULL;
      `);

      // Set default for any NULL values
      await sequelize.query(`
        UPDATE topics 
        SET priority_temp = 'LOW'
        WHERE priority_temp IS NULL;
      `);

      // Drop the old column
      await sequelize.query(`
        ALTER TABLE topics 
        DROP COLUMN priority;
      `);

      // Rename the temp column to priority
      await sequelize.query(`
        ALTER TABLE topics 
        RENAME COLUMN priority_temp TO priority;
      `);

      // Set default value
      await sequelize.query(`
        ALTER TABLE topics 
        ALTER COLUMN priority SET DEFAULT 'LOW';
      `);

      console.log('✅ Successfully converted priority column to VARCHAR');
    } else if (currentType === 'character varying' || currentType === 'varchar' || currentType === 'text') {
      console.log('✅ Priority column is already VARCHAR/TEXT. No changes needed.');
    } else {
      console.log(`⚠️  Priority column has unexpected type: ${currentType}`);
    }

    process.exit(0);
  } catch (e) {
    console.error('Error fixing priority column:', e.message);
    console.error(e);
    process.exit(1);
  }
}

fixPriorityColumn();
