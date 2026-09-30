# ============================================================
# BIZLENS AI - BUSINESS CATEGORY MAPPING
# ============================================================
# ============================================================
# BizLens AI - OSM to BizLens Category Mapping
# ============================================================

BIZLENS_CATEGORIES = {

    # --------------------------------------------------------
    # FOOD & BEVERAGE
    # --------------------------------------------------------

    "cafe": [
        "amenity:cafe",
    ],

    "restaurant": [
        "amenity:restaurant",
    ],

    "bakery": [
        "shop:bakery",
    ],

    "fast_food": [
        "amenity:fast_food",
    ],

    "juice_shop": [
        "amenity:juice_bar",
        "shop:juice",
    ],


    # --------------------------------------------------------
    # GROCERY & FOOD RETAIL
    # --------------------------------------------------------

    "grocery": [
        "shop:grocery",
    ],

    "supermarket": [
        "shop:supermarket",
    ],

    "vegetable_fruit": [
        "shop:greengrocer",
    ],

    "dairy": [
        "shop:dairy",
    ],

    "meat": [
        "shop:butcher",
    ],


    # --------------------------------------------------------
    # HEALTHCARE
    # --------------------------------------------------------

    "pharmacy": [
        "amenity:pharmacy",
        "shop:pharmacy",
        "shop:chemist",
    ],

    "clinic": [
        "amenity:clinic",
        "amenity:doctors",
    ],

    "dentist": [
        "amenity:dentist",
    ],

    "diagnostic": [
        "amenity:diagnostic_centre",
    ],

    "optical": [
        "shop:optician",
    ],


    # --------------------------------------------------------
    # BEAUTY & WELLNESS
    # --------------------------------------------------------

    "salon": [
        "shop:hairdresser",
    ],

    "beauty_parlour": [
        "shop:beauty",
    ],

    "spa": [
        "leisure:spa",
        "amenity:spa",
    ],

    "gym": [
        "leisure:fitness_centre",
        "amenity:gym",
    ],

    "yoga": [
        "sport:yoga",
    ],

    "sports_center": [
        "leisure:sports_centre",
    ],


    # --------------------------------------------------------
    # FASHION
    # --------------------------------------------------------

    "clothing": [
        "shop:clothes",
        "shop:fashion",
    ],

    "footwear": [
        "shop:shoes",
    ],


    # --------------------------------------------------------
    # ELECTRONICS
    # --------------------------------------------------------

    "mobile_store": [
        "shop:mobile_phone",
    ],

    "electronics": [
        "shop:electronics",
    ],

    "furniture": [
        "shop:furniture",
    ],

    "hardware": [
        "shop:hardware",
    ],

    "electrical": [
        "shop:electrical",
    ],

    "plumbing": [
        "shop:plumbing",
    ],


    # --------------------------------------------------------
    # HOME / SERVICES
    # --------------------------------------------------------

    "laundry": [
        "shop:laundry",
    ],


    # --------------------------------------------------------
    # EDUCATION
    # --------------------------------------------------------

    "tuition": [
        "amenity:school",
    ],

    "computer_institute": [
        "shop:computer",
    ],


    # --------------------------------------------------------
    # STATIONERY
    # --------------------------------------------------------

    "stationery": [
        "shop:stationery",
    ],


    # --------------------------------------------------------
    # AUTOMOTIVE
    # --------------------------------------------------------

    "petrol_pump": [
        "amenity:fuel",
    ],

    "car_service": [
        "shop:car_repair",
        "amenity:car_repair",
    ],

    "bike_service": [
        "shop:motorcycle",
        "shop:motorcycle_repair",
    ],

    "car_wash": [
        "amenity:car_wash",
    ],


    # --------------------------------------------------------
    # PETS
    # --------------------------------------------------------

    "pet_shop": [
        "shop:pet",
    ],


    # --------------------------------------------------------
    # MOBILE / TECH SERVICES
    # --------------------------------------------------------

    "mobile_repair": [
        "shop:mobile_phone",
    ],


    # --------------------------------------------------------
    # LOGISTICS / PRINTING
    # --------------------------------------------------------

    "courier": [
        "amenity:post_office",
    ],

    "printing": [
        "shop:copyshop",
        "shop:printing",
    ],


    # --------------------------------------------------------
    # GENERAL RETAIL
    # --------------------------------------------------------

    "general_store": [
        "shop:general",
    ],
}


# ============================================================
# VALIDATION
# ============================================================

EXPECTED_CATEGORY_COUNT = 42


if __name__ == "__main__":

    print("=" * 60)
    print("BIZLENS CATEGORY MAPPING")
    print("=" * 60)

    print(f"Total categories: {len(BIZLENS_CATEGORIES)}")
    print()

    for i, category in enumerate(BIZLENS_CATEGORIES, start=1):
        print(f"{i:2}. {category}")

    print()

    if len(BIZLENS_CATEGORIES) == EXPECTED_CATEGORY_COUNT:
        print("SUCCESS: All 42 BizLens categories are present.")
    else:
        print(
            f"WARNING: Expected {EXPECTED_CATEGORY_COUNT} categories "
            f"but found {len(BIZLENS_CATEGORIES)}."
        )


# ------------------------------------------------------------
# VERIFY CATEGORY COUNT
# ------------------------------------------------------------

if __name__ == "__main__":

    print("=" * 60)
    print("BIZLENS AI - CATEGORY CONFIGURATION")
    print("=" * 60)

    print(
        f"\nTotal BizLens categories: "
        f"{len(BIZLENS_CATEGORIES)}"
    )

    for number, category in enumerate(
        BIZLENS_CATEGORIES,
        start=1
    ):
        print(
            f"{number:02d}. {category}"
        )

    print("\nDone!")