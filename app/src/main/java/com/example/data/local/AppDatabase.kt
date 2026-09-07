package com.example.data.local

import android.content.Context
import androidx.room.*
import com.example.data.model.StoredNodeEntity
import com.example.data.model.SymbolEntryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface NodeDao {
    @Query("SELECT * FROM stored_nodes ORDER BY createdAt ASC")
    fun getAllNodesFlow(): Flow<List<StoredNodeEntity>>

    @Query("SELECT * FROM stored_nodes ORDER BY createdAt ASC")
    suspend fun getAllNodes(): List<StoredNodeEntity>

    @Query("SELECT * FROM stored_nodes WHERE id = :nodeId LIMIT 1")
    suspend fun getNodeById(nodeId: String): StoredNodeEntity?

    @Query("SELECT * FROM stored_nodes WHERE parentId = :parentId ORDER BY createdAt ASC")
    fun getChildrenOfParentFlow(parentId: String): Flow<List<StoredNodeEntity>>

    @Query("SELECT * FROM stored_nodes WHERE parentId = :parentId ORDER BY createdAt ASC")
    suspend fun getChildrenOfParent(parentId: String): List<StoredNodeEntity>

    @Query("SELECT * FROM stored_nodes WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    fun searchNodes(query: String): Flow<List<StoredNodeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(node: StoredNodeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(nodes: List<StoredNodeEntity>)

    @Update
    suspend fun update(node: StoredNodeEntity)

    @Query("DELETE FROM stored_nodes WHERE id = :nodeId")
    suspend fun deleteById(nodeId: String)

    @Query("DELETE FROM stored_nodes WHERE id IN (:nodeIds)")
    suspend fun deleteByIds(nodeIds: List<String>)

    @Query("DELETE FROM stored_nodes")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(nodes: List<StoredNodeEntity>) {
        deleteAll()
        insertAll(nodes)
    }
}

@Dao
interface SymbolBookDao {
    @Query("SELECT * FROM symbol_book ORDER BY rawSymbol ASC")
    fun getAllSymbolsFlow(): Flow<List<SymbolEntryEntity>>

    @Query("SELECT * FROM symbol_book ORDER BY rawSymbol ASC")
    suspend fun getAllSymbols(): List<SymbolEntryEntity>

    @Query("SELECT * FROM symbol_book WHERE rawSymbol = :rawSymbol LIMIT 1")
    suspend fun getSymbolByRaw(rawSymbol: String): SymbolEntryEntity?

    @Query("SELECT * FROM symbol_book WHERE rawSymbol LIKE '%' || :query || '%' OR canonicalName LIKE '%' || :query || '%'")
    fun searchSymbols(query: String): Flow<List<SymbolEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(symbol: SymbolEntryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(symbols: List<SymbolEntryEntity>)

    @Query("DELETE FROM symbol_book WHERE rawSymbol = :rawSymbol")
    suspend fun deleteByRawSymbol(rawSymbol: String)

    @Query("DELETE FROM symbol_book")
    suspend fun deleteAll()

    @Transaction
    suspend fun replaceAll(symbols: List<SymbolEntryEntity>) {
        deleteAll()
        insertAll(symbols)
    }
}

@Database(
    entities = [StoredNodeEntity::class, SymbolEntryEntity::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun nodeDao(): NodeDao
    abstract fun symbolBookDao(): SymbolBookDao

    companion object {
        private const val DATABASE_NAME = "asset_tree.db"

        val MIGRATION_1_2 = object : androidx.room.migration.Migration(1, 2) {
            override fun migrate(database: androidx.sqlite.db.SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE symbol_book ADD COLUMN assetType TEXT NOT NULL DEFAULT ''")
            }
        }

        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DATABASE_NAME
                )
                    .addMigrations(MIGRATION_1_2)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

