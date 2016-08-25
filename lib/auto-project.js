'use babel';

/* global atom:true */
// eslint-disable-next-line import/no-unresolved
import { CompositeDisposable, GitRepository } from 'atom';
import path from 'path';

export default {
  subscriptions: null,
  lastAddedPath: null,

  activate(state) { // eslint-disable-line no-unused-vars
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.observePaneItems(this._observeItem.bind(this)));
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(this._setProject.bind(this)));
    this.subscriptions.add(atom.packages.onDidActivateInitialPackages(() => {
      this._setProject(atom.workspace.getActivePaneItem());
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    if (this.lastAddedPath) {
      atom.project.removePath(this.lastAddedPath);
    }
  },

  _observeItem(item) {
    if (item && typeof item.onDidChangePath === 'function') {
      this.subscriptions.add(item.onDidChangePath(() => {
        this._setProject(item);
      }));
    }
  },

  _setProject(item) {
    if (item && typeof item.getPath === 'function' && item.getPath()) {
      if (atom.project.contains(item.getPath()) === false) {
        const repo = GitRepository.open(item.getPath(), { refreshOnWindowFocus: false });
        const dirPath = repo ? repo.getWorkingDirectory() : path.dirname(item.getPath());
        if (this.lastAddedPath !== dirPath) {
          if (this.lastAddedPath) {
            atom.project.removePath(this.lastAddedPath);
          }
          atom.project.addPath(dirPath);
          this.lastAddedPath = dirPath;
        }
      }

      const treeView = atom.packages.getActivePackage('tree-view');
      if (treeView && treeView.mainModule.treeView && treeView.mainModule.treeView.isVisible()) {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:reveal-active-file');
      }
    }
  },
};
