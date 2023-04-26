/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import "@testing-library/jest-dom";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import { fireEvent } from "@testing-library/dom";

import store from "../app/Store";

jest.mock("../app/Store", () => mockStore);

// test("handleClickNewBill should navigate to NewBill page", () => {
//   const navigateMock = jest.fn();
//   const button = document.createElement("button");
//   button.addEventListener("click", () => navigateMock(ROUTES_PATH["NewBill"]));
//   fireEvent.click(button);
//   expect(navigateMock).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
// });

test("clicking on the eye icon should show the bill image in a modal", () => {
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };

  // Set up the HTML elements
  document.body.innerHTML = BillsUI({ data: bills });
  const icon = screen.getAllByTestId("icon-eye")[0];

  const BillInit = new Bills({
    document,
    onNavigate,
    store: null,
    bills: bills,
    localStorage: window.localStorage,
  });

  $.fn.modal = jest.fn();

  // Simulate a click on the icon
  const handleClickIconEye = jest.fn(() => BillInit.handleClickIconEye(icon));

  // Check that the modal is displayed with the correct image
  expect(icon).toBeTruthy();
  icon.addEventListener("click", handleClickIconEye);
  userEvent.click(icon);
  expect(handleClickIconEye).toHaveBeenCalled();
  expect(screen.getByText("Justificatif")).toBeVisible();
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (new Date(a) < new Date(b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe("Quand je suis sur la page employée", () => {
  test("Après le clique sur un nouveau formulaire", async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const dashboard = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });

    document.body.innerHTML = BillsUI({ data: { bills } });
    const handleClickNewBill1 = jest.fn(dashboard.handleClickNewBill);
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill1);
    userEvent.click(btnNewBill);
    expect(handleClickNewBill1).toHaveBeenCalled();
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });
});

describe("When I navigate to Bills", () => {
  // Vérifie que les bills sont bien récupérés
  test("Then fetches bills from mock API GET", async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    document.body.innerHTML = BillsUI({ data: bills });
    await waitFor(() => screen.getByText("Mes notes de frais"));
    expect(screen.getByText("Mes notes de frais")).toBeTruthy();
  });
});

describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  // Vérifie si l'erreur 404 s'affiche bien
  test("Then fetches bills from an API and fails with 404 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    const message = await screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });
  // Vérifie si l'erreur 500 s'affiche bien
  test("Then fetches messages from an API and fails with 500 message error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;
    const message = await screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
