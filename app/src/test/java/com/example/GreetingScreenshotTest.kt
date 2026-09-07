package com.example

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.components.PortfolioSummaryBar
import com.example.ui.theme.MyApplicationTheme
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class GreetingScreenshotTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun portfolioSummary_screenshot() {
        val dummyRoot = CalculatedNode(
            id = "root",
            parentId = null,
            name = "کل دارایی‌ها",
            quantity = 1.0,
            unit = "سبد",
            unitPrice = 0.0,
            totalValue = 5000000.0,
            percentOfTotal = 100.0,
            percentOfGroup = 100.0,
            isGroup = true,
            children = emptyList(),
            depth = 0,
            childCount = 3
        )

        composeTestRule.setContent {
            MyApplicationTheme(darkTheme = false) {
                PortfolioSummaryBar(
                    rootCalculated = dummyRoot,
                    settings = DisplaySettings(),
                    onOpenChart = {}
                )
            }
        }

        composeTestRule.onRoot().captureRoboImage(filePath = "src/test/screenshots/summary.png")
    }
}
