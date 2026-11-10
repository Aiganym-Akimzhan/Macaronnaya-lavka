function loadDocument(link, query) {
  fetch(link)
    .then(function (response) {
      return response.text();
    })
    .then(function (text) {
      document.querySelectorAll(query).forEach(function (doc) {
        doc.innerHTML = text;
      });

      if (link === "/navbar/navbar.html") {
        const menuToggle = document.querySelector("#menuToggle");
        const mobileMenu = document.querySelector("#mobileMenu");

        if (menuToggle && mobileMenu) {
          menuToggle.addEventListener("click", function () {
            mobileMenu.classList.toggle("hidden");
          });
        }
      }
    });
}

loadDocument("/navbar/navbar.html", 'section[name="navbar"]');
loadDocument("/footer/footer.html", 'section[name="footer"]');

const PRODUCTS_PER_PAGE = 12;

let search = "";
let category = "";
let sort = "all";
let currentPage = 1;
let totalPages = 1;
let categories = [];
let products = [];
let selectedProduct = null;

const productGrid = document.querySelector("#productGrid");
const productDialog = document.querySelector("#productDialog");

function formatPrice(price) {
  return Number(price).toLocaleString("ru-RU") + " ₸";
}

function renderFilters() {
  const filters = document.querySelector("#filters");
  let buttons = "";

  const allCategories = ["", ...categories];

  for (const item of allCategories) {
    let style =
      "border-[#eaded4] bg-white text-[#806d60] hover:border-[#56351f]";

    if (item === category) {
      style = "border-[#56351f] bg-[#56351f] text-white";
    }

    const label = item || "Все";

    buttons += `
      <button
        class="rounded-full border px-4 py-2 transition ${style}"
        data-category="${item}"
      >
        ${label}
      </button>
    `;
  }

  filters.innerHTML = buttons;
}

function createProductCard(product) {
  return `
    <article
      class="group cursor-pointer overflow-hidden rounded-[20px]
             border border-[#eaded4] bg-white transition
             hover:-translate-y-1 hover:shadow-2xl"
      data-product-id="${product.id}"
    >
      <div class="relative overflow-hidden bg-[#f1eeeb]">
        <img
          class="h-[145px] w-full object-cover transition duration-500
                 hover:scale-110 sm:h-[200px]"
          src="${product.image}"
          alt="${product.name}"
        >

        <span class="absolute left-2 top-2 rounded-full
                     bg-[#fff8f0] px-2.5 py-1 text-xs font-bold
                     text-[#a85d4f] sm:left-3 sm:top-3">
          ${product.tag}
        </span>
      </div>

      <div class="p-3 sm:p-5">
        <p class="text-xs font-bold uppercase tracking-widest
                  text-[#c66e61]">
          ${product.category}
        </p>

        <h3 class="mt-2 min-h-10 text-xl font-semibold">
          ${product.name}
        </h3>

        <div class="mt-8 flex items-center justify-between gap-2">
          <span class="text-xl font-bold">
            ${formatPrice(product.price)}
          </span>

          <span class="text-xs text-[#9a918b]">
            Подробнее ↗
          </span>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const emptyState = document.querySelector("#emptyState");

  if (products.length === 0) {
    emptyState.classList.remove("hidden");
    productGrid.classList.add("hidden");
    productGrid.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.classList.remove("hidden");

  let cards = "";

  for (const product of products) {
    cards += createProductCard(product);
  }

  productGrid.innerHTML = cards;
}

function renderPagination() {
  const pagination = document.querySelector("#pagination");

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = `
    <button
      class="rounded-full border border-[#eaded4] px-4 py-2
             disabled:opacity-40"
      data-page="${currentPage - 1}"
      ${currentPage === 1 ? "disabled" : ""}
    >
      ← Назад
    </button>

    <span class="text-[#806d60]">
      Страница ${currentPage} из ${totalPages}
    </span>

    <button
      class="rounded-full border border-[#eaded4] px-4 py-2
             disabled:opacity-40"
      data-page="${currentPage + 1}"
      ${currentPage === totalPages ? "disabled" : ""}
    >
      Далее →
    </button>
  `;
}

async function loadProducts() {
  const params = new URLSearchParams();

  params.set("search", search);
  params.set("category", category);
  params.set("sort", sort);
  params.set("page", currentPage);
  params.set("limit", PRODUCTS_PER_PAGE);

  productGrid.classList.remove("hidden");
  productGrid.innerHTML = `
    <p class="col-span-full py-12 text-center">
      Загружаем десерты...
    </p>
  `;

  try {
    const response = await fetch("/api/products?" + params);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Не удалось загрузить продукты.");
    }

    products = data.items;
    currentPage = data.page;
    totalPages = data.pages;
    categories = data.categories;

    document
      .querySelector("#clearSearch")
      .classList.toggle("hidden", search === "");

    renderFilters();
    renderProducts();
    renderPagination();
  } catch (error) {
    productGrid.innerHTML = `
      <p class="col-span-full rounded-2xl bg-red-50 p-6
                text-center text-red-700">
        ${error.message}
      </p>
    `;

    document.querySelector("#pagination").innerHTML = "";
  }
}

function applyFilters() {
  currentPage = 1;
  loadProducts();
}

function openProduct(product) {
  selectedProduct = product;

  document.querySelector("#dialogImage").src = product.image;
  document.querySelector("#dialogImage").alt = product.name;
  document.querySelector("#dialogName").innerHTML = product.name;
  document.querySelector("#dialogCategory").innerHTML = product.category;
  document.querySelector("#dialogTag").innerHTML = product.tag;
  document.querySelector("#dialogDescription").innerHTML = product.description;
  document.querySelector("#dialogPrice").innerHTML = formatPrice(product.price);
  document.querySelector("#dialogMessage").innerHTML = "";

  productDialog.classList.remove("hidden");
  productDialog.classList.add("flex");
}

function closeProductDialog() {
  productDialog.classList.add("hidden");
  productDialog.classList.remove("flex");
}

function handleProductClick(event) {
  const card = event.target.closest("[data-product-id]");

  if (!card) {
    return;
  }

  const productId = Number(card.dataset.productId);

  for (const product of products) {
    if (Number(product.id) === productId) {
      openProduct(product);
      break;
    }
  }
}

async function deleteProduct() {
  if (!selectedProduct) {
    return;
  }

  const answer = window.confirm(
    'Вы действительно хотите удалить "' + selectedProduct.name + '"?',
  );

  if (!answer) {
    return;
  }

  try {
    const response = await fetch("/api/products/" + selectedProduct.id, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Не удалось удалить продукт.");
    }

    closeProductDialog();

    window.alert("Продукт успешно удалён!");

    await loadProducts();
  } catch (error) {
    window.alert(error.message);
  }
}

async function saveProduct(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('[type="submit"]');
  const message = document.querySelector("#formMessage");

  const product = {
    name: form.elements.name.value,
    price: Number(form.elements.price.value),
    image: form.elements.image.value,
    category: form.elements.category.value,
    tag: form.elements.tag.value,
    description: form.elements.description.value,
  };

  submitButton.disabled = true;
  message.innerHTML = "Сохраняем продукт...";

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Не удалось сохранить продукт.");
    }

    form.reset();
    form.classList.add("hidden");
    message.innerHTML = "";

    document.querySelector("#searchInput").value = "";

    search = "";
    category = "";
    currentPage = 1;

    window.alert("Продукт успешно добавлен!");

    await loadProducts();
  } catch (error) {
    message.innerHTML = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

function toggleProductForm() {
  const form = document.querySelector("#productForm");

  form.classList.toggle("hidden");
}

function cancelProductForm() {
  document.querySelector("#productForm").classList.add("hidden");
  document.querySelector("#formMessage").innerHTML = "";
}

function setupEvents() {
  document
    .querySelector("#searchInput")
    .addEventListener("input", function (event) {
      search = event.target.value.trim();
      applyFilters();
    });

  document.querySelector("#clearSearch").addEventListener("click", function () {
    document.querySelector("#searchInput").value = "";
    search = "";
    applyFilters();
  });

  document
    .querySelector("#filters")
    .addEventListener("click", function (event) {
      const button = event.target.closest("[data-category]");

      if (button) {
        category = button.dataset.category;
        applyFilters();
      }
    });

  document
    .querySelector("#sortSelect")
    .addEventListener("change", function (event) {
      sort = event.target.value;
      applyFilters();
    });

  document
    .querySelector("#pagination")
    .addEventListener("click", function (event) {
      const button = event.target.closest("[data-page]");

      if (!button || button.disabled) {
        return;
      }

      currentPage = Number(button.dataset.page);

      loadProducts();

      document.querySelector("#catalog").scrollIntoView({
        behavior: "smooth",
      });
    });

  productGrid.addEventListener("click", handleProductClick);

  document
    .querySelector("#closeDialog")
    .addEventListener("click", closeProductDialog);

  productDialog.addEventListener("click", function (event) {
    if (event.target === productDialog) {
      closeProductDialog();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !productDialog.classList.contains("hidden")) {
      closeProductDialog();
    }
  });

  document
    .querySelector("#deleteProduct")
    .addEventListener("click", deleteProduct);

  document
    .querySelector("#showAddForm")
    .addEventListener("click", toggleProductForm);

  document
    .querySelector("#cancelAdd")
    .addEventListener("click", cancelProductForm);

  document
    .querySelector("#productForm")
    .addEventListener("submit", saveProduct);
}

async function startPage() {
  setupEvents();
  await loadProducts();
}

startPage();
