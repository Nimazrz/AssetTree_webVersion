package com.example.utils

import java.util.Calendar
import java.util.Locale

object PersianDateUtils {

    private val PERSIAN_MONTH_NAMES = arrayOf(
        "فروردین", "اردیبهشت", "خرداد",
        "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر",
        "دی", "بهمن", "اسفند"
    )

    private val PERSIAN_WEEKDAYS = arrayOf(
        "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"
    )

    data class PersianDate(
        val year: Int,
        val month: Int,
        val day: Int,
        val monthName: String,
        val dayOfWeekName: String,
        val hour: Int,
        val minute: Int,
        val second: Int
    )

    fun getPersianDate(timestampMillis: Long): PersianDate {
        val calendar = Calendar.getInstance().apply { timeInMillis = timestampMillis }
        val gYear = calendar.get(Calendar.YEAR)
        val gMonth = calendar.get(Calendar.MONTH) + 1
        val gDay = calendar.get(Calendar.DAY_OF_MONTH)
        val dayOfWeekIndex = (calendar.get(Calendar.DAY_OF_WEEK) - 1) % 7 // 0=Sunday (یکشنبه)
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)
        val second = calendar.get(Calendar.SECOND)

        val (jYear, jMonth, jDay) = gregorianToJalali(gYear, gMonth, gDay)
        val mName = if (jMonth in 1..12) PERSIAN_MONTH_NAMES[jMonth - 1] else ""
        val wName = if (dayOfWeekIndex in PERSIAN_WEEKDAYS.indices) PERSIAN_WEEKDAYS[dayOfWeekIndex] else ""

        return PersianDate(jYear, jMonth, jDay, mName, wName, hour, minute, second)
    }

    fun getCurrentPersianDate(): PersianDate {
        return getPersianDate(System.currentTimeMillis())
    }

    fun formatPersianDate(timestampMillis: Long, includeTime: Boolean = true): String {
        val p = getPersianDate(timestampMillis)
        val dStr = NumberFormatUtils.toPersianDigits(p.day)
        val yStr = NumberFormatUtils.toPersianDigits(p.year)
        val hStr = NumberFormatUtils.toPersianDigits(String.format(Locale.US, "%02d", p.hour))
        val mStr = NumberFormatUtils.toPersianDigits(String.format(Locale.US, "%02d", p.minute))

        return if (includeTime) {
            "${p.dayOfWeekName} $dStr ${p.monthName} $yStr | $hStr:$mStr"
        } else {
            "${p.dayOfWeekName} $dStr ${p.monthName} $yStr"
        }
    }

    fun formatCurrentPersianDateTime(includeTime: Boolean = true): String {
        return formatPersianDate(System.currentTimeMillis(), includeTime)
    }

    fun getBackupFileName(): String {
        val p = getCurrentPersianDate()
        return "AssetTree_Backup_${p.year}_${String.format(Locale.US, "%02d", p.month)}_${String.format(Locale.US, "%02d", p.day)}_${String.format(Locale.US, "%02d", p.hour)}${String.format(Locale.US, "%02d", p.minute)}.json"
    }

    private fun gregorianToJalali(gy: Int, gm: Int, gd: Int): Triple<Int, Int, Int> {
        val gDaysInMonth = intArrayOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
        val jDaysInMonth = intArrayOf(31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29)

        var gy2 = gy - 1600
        var gm2 = gm - 1
        var gd2 = gd - 1

        var gDayNo = 365 * gy2 + (gy2 + 3) / 4 - (gy2 + 99) / 100 + (gy2 + 399) / 400
        for (i in 0 until gm2) {
            gDayNo += gDaysInMonth[i]
        }
        if (gm2 > 1 && ((gy2 % 4 == 0 && gy2 % 100 != 0) || (gy2 % 400 == 0))) {
            gDayNo++
        }
        gDayNo += gd2

        var jDayNo = gDayNo - 79
        val jNp = jDayNo / 12053
        jDayNo %= 12053

        var jy = 979 + 33 * jNp + 4 * (jDayNo / 1461)
        jDayNo %= 1461

        if (jDayNo >= 366) {
            jy += (jDayNo - 1) / 365
            jDayNo = (jDayNo - 1) % 365
        }

        var jm = 0
        for (i in 0 until 11) {
            if (jDayNo < jDaysInMonth[i]) {
                jm = i + 1
                break
            }
            jDayNo -= jDaysInMonth[i]
        }
        if (jm == 0) {
            jm = 12
        }
        val jd = jDayNo + 1
        return Triple(jy, jm, jd)
    }
}
